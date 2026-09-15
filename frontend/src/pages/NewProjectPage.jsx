import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useProjects } from '../context/ProjectContext';
import './NewProjectPage.css';

const initialForm = {
  name: '',
  description: '',
  teamMembers: [],
  technologies: [],
  owner: '',
  repositoryUrl: '',
  status: 'Active',
};

export default function NewProjectPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { projects, createProject } = useProjects();
  const [form, setForm] = useState(initialForm);
  const [memberInput, setMemberInput] = useState('');
  const [technologyInput, setTechnologyInput] = useState('');
  const [errors, setErrors] = useState({});

  const returnTo = location.state?.from || '/';

  const addValue = (field, value, setInput) => {
    const trimmed = value.trim();
    if (!trimmed || form[field].includes(trimmed)) {
      setInput('');
      return;
    }
    setForm((current) => ({ ...current, [field]: [...current[field], trimmed] }));
    setInput('');
  };

  const removeValue = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: current[field].filter((item) => item !== value),
    }));
  };

  const submit = (event) => {
    event.preventDefault();
    const nextErrors = {};
    const name = form.name.trim();
    const description = form.description.trim();

    if (!name) nextErrors.name = 'Project name is required.';
    if (!description) nextErrors.description = 'Description is required.';
    if (form.teamMembers.length === 0) nextErrors.teamMembers = 'Add at least one team member.';
    if (projects.some((project) => project.name.toLowerCase() === name.toLowerCase())) {
      nextErrors.name = 'A project with this name already exists.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    createProject({
      ...form,
      name,
      description,
      owner: form.owner.trim(),
      repositoryUrl: form.repositoryUrl.trim(),
    });
    navigate(returnTo, { replace: true });
  };

  return (
    <PageContainer
      eyebrow="Projects"
      title="Create new project"
      subtitle="Add a project to your knowledge space. You can update these details later."
      actions={
        <Button variant="secondary" onClick={() => navigate(returnTo)}>
          Cancel
        </Button>
      }
    >
      <Card className="new-project-card">
        <form className="new-project-form" onSubmit={submit} noValidate>
          <Field
            label="Project name"
            value={form.name}
            error={errors.name}
            onChange={(value) => setForm((current) => ({ ...current, name: value }))}
          />
          <div className="new-project-field">
            <label htmlFor="project-description">Description</label>
            <textarea
              id="project-description"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              rows="4"
            />
            {errors.description && <div className="new-project-error">{errors.description}</div>}
          </div>

          <TagField
            id="project-members"
            label="Team members"
            value={memberInput}
            items={form.teamMembers}
            error={errors.teamMembers}
            placeholder="Add a member"
            onChange={setMemberInput}
            onAdd={() => addValue('teamMembers', memberInput, setMemberInput)}
            onRemove={(value) => removeValue('teamMembers', value)}
          />
          <TagField
            id="project-technologies"
            label="Technologies"
            value={technologyInput}
            items={form.technologies}
            placeholder="Add a technology"
            onChange={setTechnologyInput}
            onAdd={() => addValue('technologies', technologyInput, setTechnologyInput)}
            onRemove={(value) => removeValue('technologies', value)}
          />

          <Field
            label="Project owner"
            value={form.owner}
            onChange={(value) => setForm((current) => ({ ...current, owner: value }))}
          />
          <Field
            label="Repository URL"
            value={form.repositoryUrl}
            onChange={(value) => setForm((current) => ({ ...current, repositoryUrl: value }))}
          />

          <fieldset className="new-project-status">
            <legend>Project status</legend>
            {['Active', 'Archived'].map((status) => (
              <label key={status}>
                <input
                  type="radio"
                  name="project-status"
                  value={status}
                  checked={form.status === status}
                  onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                />
                {status}
              </label>
            ))}
          </fieldset>

          <div className="new-project-actions">
            <Button type="button" variant="secondary" onClick={() => navigate(returnTo)}>Cancel</Button>
            <Button type="submit">Create Project</Button>
          </div>
        </form>
      </Card>
    </PageContainer>
  );
}

function Field({ label, value, error, onChange }) {
  const id = `project-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div className="new-project-field">
      <label htmlFor={id}>{label}</label>
      <input id={id} value={value} onChange={(event) => onChange(event.target.value)} />
      {error && <div className="new-project-error">{error}</div>}
    </div>
  );
}

function TagField({ id, label, value, items, error, placeholder, onChange, onAdd, onRemove }) {
  return (
    <div className="new-project-field">
      <label htmlFor={id}>{label}</label>
      <div className="new-project-tag-input">
        <input
          id={id}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onAdd();
            }
          }}
        />
        <Button type="button" variant="secondary" size="sm" onClick={onAdd}>Add</Button>
      </div>
      {items.length > 0 && (
        <div className="new-project-tags">
          {items.map((item) => (
            <span className="new-project-tag" key={item}>
              {item}
              <button type="button" aria-label={`Remove ${item}`} onClick={() => onRemove(item)}>×</button>
            </span>
          ))}
        </div>
      )}
      {error && <div className="new-project-error">{error}</div>}
    </div>
  );
}
